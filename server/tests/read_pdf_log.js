const fs = require('fs');

const logPath = 'C:\\Users\\GI\\.gemini\\antigravity-ide\\brain\\f0022a21-f08d-4c46-942a-39156e71f7bd\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error("Log file does not exist.");
  process.exit(1);
}

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

lines.forEach((line, index) => {
  if (!line) return;
  try {
    const obj = JSON.parse(line);
    const content = JSON.stringify(obj.content || '');
    if (content.includes('pdfjsLib') || content.includes('pdf.min.js') || content.includes('canvas')) {
      console.log(`[Line ${index}] Matched PDFJS/Canvas`);
      console.log(content.substring(0, 500));
      console.log('---');
    }
  } catch (err) {}
});
