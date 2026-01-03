
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    errors = []
    for i, line in enumerate(lines):
        lnum = i + 1
        
        # Check trailing spaces
        if line.rstrip('\n') != line.rstrip():
            errors.append(f"Line {lnum}: Trailing whitespace")
            
        # Check list marker spacing
        # Ordered list
        match_ord = re.match(r'^\s*\d+\.(\s+)', line)
        if match_ord:
            spaces = match_ord.group(1)
            if len(spaces) != 1:
                errors.append(f"Line {lnum}: Ordered list marker has {len(spaces)} spaces (expected 1)")
        
        # Unordered list
        match_unord = re.match(r'^\s*-(\s+)', line)
        if match_unord:
            spaces = match_unord.group(1)
            if len(spaces) != 1:
                errors.append(f"Line {lnum}: Unordered list marker has {len(spaces)} spaces (expected 1)")
                
        # Check blank lines around headers (simplified)
        if line.startswith('#'):
            # Check line before
            if i > 0:
                prev_line = lines[i-1].strip()
                if prev_line and prev_line != '---': # --- is often used as divider
                    # errors.append(f"Line {lnum}: Header missing blank line before")
                    pass # Relaxed check

    return errors

errors = check_file(r'c:\Users\ma235\OneDrive\デスクトップ\Hyggely-RsvCys\docs\manual.md')
if errors:
    print("Found Errors:")
    for e in errors:
        print(e)
else:
    print("No obvious errors found.")
