#!/usr/bin/env python3
import sys

# Read the file
with open('src\\pages\\DailyQuiz.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
print(f"Lines 348-355:")
for i in range(348, min(356, len(lines))):
    line = lines[i]
    print(f"{i}: {repr(line)}")

# Find the line with )}
# and replace the following closing divs
for i in range(len(lines) - 1, -1, -1):
    if i >= 348 and ')}' in lines[i]:
        print(f"\nFound closing at line {i}")
        # Check if this is followed by the old closing structure
        if i + 1 < len(lines):
            if '</div>' in lines[i+1]:
                print(f"Line {i+1}: {repr(lines[i+1])}")
                # Replace the closing structure
                new_lines = lines[:i+1]
                # Add the correct closing tags with proper indentation
                new_lines.append('                        </div>\n')
                new_lines.append('                    </div>\n')
                new_lines.append('                </div>\n')
                new_lines.append('            </div>\n')
                new_lines.append('        </main>\n')
                new_lines.append('    </div>\n')
                new_lines.append('    );\n')
                new_lines.append('}\n')
                
                # Write the file
                with open('src\\pages\\DailyQuiz.jsx', 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                
                print("File fixed!")
                sys.exit(0)

print("Could not find the pattern to fix")
sys.exit(1)
