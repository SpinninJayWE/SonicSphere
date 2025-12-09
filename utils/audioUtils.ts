// A simple heuristic parser for ID3v2 attached pictures (APIC)
// This avoids heavy dependencies for this demo but works on many MP3s.
export const extractAlbumArt = async (file: File): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve(undefined);
        return;
      }
      const dataView = new DataView(buffer);
      
      // Look for ID3 identifier
      if (dataView.getUint8(0) === 0x49 && dataView.getUint8(1) === 0x44 && dataView.getUint8(2) === 0x33) {
        const id3Size =
          ((dataView.getUint8(6) & 0x7f) << 21) |
          ((dataView.getUint8(7) & 0x7f) << 14) |
          ((dataView.getUint8(8) & 0x7f) << 7) |
          (dataView.getUint8(9) & 0x7f);
        
        let offset = 10;
        const extendedHeader = dataView.getUint8(5) & 0x40;
        if (extendedHeader) {
            // Skip extended header if present (simplified)
            // Ideally we parse the size of ext header
             offset += 4; // Minimal skip, imprecise for robust prod use but okay for demo
        }

        while (offset < id3Size) {
          const frameId1 = dataView.getUint8(offset);
          const frameId2 = dataView.getUint8(offset + 1);
          const frameId3 = dataView.getUint8(offset + 2);
          const frameId4 = dataView.getUint8(offset + 3);
          
          // APIC or PIC
          if (frameId1 === 0x41 && frameId2 === 0x50 && frameId3 === 0x49 && frameId4 === 0x43) {
             const size = dataView.getUint32(offset + 4); 
             // Synchsafe integer check often needed for ID3v2.4 but standard int for 2.3 usually works for size in simple parsers
             // This is a rough extractor
             let mimeType = "";
             let picOffset = offset + 10;
             const encoding = dataView.getUint8(picOffset); // 0 = ISO-8859-1, 1 = UCS-2, etc.
             picOffset++;
             
             // Read MIME type
             while (dataView.getUint8(picOffset) !== 0) {
               mimeType += String.fromCharCode(dataView.getUint8(picOffset));
               picOffset++;
             }
             picOffset++; // Skip null terminator
             
             // Skip picture type
             picOffset++;
             
             // Skip description
             while (dataView.getUint8(picOffset) !== 0) {
                 picOffset++;
                 if (encoding === 1 || encoding === 2) picOffset++; // Skip double byte nulls if needed roughly
             }
             picOffset++; // Skip null terminator
             
             const imgSize = size - (picOffset - (offset + 10));
             if (imgSize > 0 && picOffset + imgSize < buffer.byteLength) {
                const imgData = new Uint8Array(buffer, picOffset, imgSize);
                const blob = new Blob([imgData], { type: mimeType || 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                
                // Convert to base64 for Gemini
                const reader64 = new FileReader();
                reader64.onloadend = () => {
                    resolve(reader64.result as string);
                }
                reader64.readAsDataURL(blob);
                return;
             }
          }
          offset += 10 + dataView.getUint32(offset + 4); 
          if (offset > buffer.byteLength - 10) break;
        }
      }
      resolve(undefined);
    };
    reader.onerror = () => resolve(undefined);
    // Read first 2MB which usually contains ID3 tags
    reader.readAsArrayBuffer(file.slice(0, 2 * 1024 * 1024));
  });
};