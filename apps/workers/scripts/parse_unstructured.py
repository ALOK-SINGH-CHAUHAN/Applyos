import sys
import os
from unstructured.partition.auto import partition

def main():
    if len(sys.argv) < 2:
        print("Error: No file path provided", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File does not exist at {file_path}", file=sys.stderr)
        sys.exit(1)

    try:
        # partition automatically parses docx, pdf, txt, etc.
        elements = partition(filename=file_path)
        text = "\n".join([el.text for el in elements if el.text])
        print(text)
    except Exception as e:
        print(f"Error partitioning file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
