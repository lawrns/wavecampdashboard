const fs = require('fs');
const path = require('path');

const routes = [
  'src/app/api/add-ons/route.ts',
  'src/app/api/assignments/participants/route.ts',
  'src/app/api/assignments/route.ts',
  'src/app/api/bookings/client/route.ts',
  'src/app/api/calendar-events/route.ts',
  'src/app/api/client/profile/route.ts',
  'src/app/api/debug/surf-camps/route.ts',
  'src/app/api/firebase-bookings/route.ts',
  'src/app/api/firebase-clients/route.ts',
  'src/app/api/firebase-surfcamps/route.ts',
  'src/app/api/gdpr/delete/route.ts',
  'src/app/api/gdpr/export/route.ts',
  'src/app/api/rooms/route.ts',
  'src/app/api/send-email/route.ts',
  'src/app/api/surf-camps/route.ts',
  'src/app/api/upload/route.ts',
  'src/app/api/wordpress/availability/route.ts',
  'src/app/api/wordpress/bookings/route.ts',
  'src/app/api/wordpress/dates/availability/route.ts',
  'src/app/api/wordpress/room-bookings/route.ts'
];

routes.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('export const dynamic')) {
      // Find the position after the last import
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        } else if (insertIndex > 0 && lines[i].trim() === '') {
          insertIndex = i;
          break;
        }
      }
      
      // Insert the dynamic export
      lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic';");
      
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`✓ Fixed: ${filePath}`);
    } else {
      console.log(`- Skipped (already has dynamic): ${filePath}`);
    }
  } catch (err) {
    console.error(`✗ Error fixing ${filePath}:`, err.message);
  }
});

console.log('\n✓ All API routes fixed!');
