import os
import subprocess
from pathlib import Path
from typing import List

def load_gitignore_patterns(gitignore_path: Path) -> List[str]:
    """Loads and returns patterns from a .gitignore file."""
    if not gitignore_path.exists():
        return []
    with gitignore_path.open("r") as f:
        return [line.strip() for line in f if line.strip() and not line.startswith("#")]

def is_ignored(file_path: Path, patterns: List[str]) -> bool:
    """Checks if a file path is ignored by the gitignore patterns."""
    relative_path = str(file_path.relative_to(Path.cwd()))
    for pattern in patterns:
        if file_path.match(pattern) or relative_path.startswith(pattern.rstrip("/")):
            return True
    return False

def collect_file_content(file_path: Path, max_lines: int = 500) -> str:
    """Collects content from a file, adding a header and footer."""
    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    if len(lines) > max_lines:
        return ""
    header = f"\n=== START FILE: {file_path} ===\n"
    footer = f"\n=== END FILE: {file_path} ===\n"
    return header + "".join(lines) + footer

def main() -> None:
    """Main function to collect frontend code context."""
    base_dir = Path.cwd()
    output_file = base_dir / "frontend_code_context.txt"
    gitignore_patterns = load_gitignore_patterns(base_dir / ".gitignore")

    # Define common directories and files to always exclude for frontend projects.
    always_excluded = {
        ".git",
        "node_modules",
        "dist",
        "build",
        "public"
    }

    # You can add specific file extensions to ignore if needed, but the .gitignore should handle most cases.
    always_excluded_file_names = {
        "yarn.lock",
        "package-lock.json",
        ".gitignore",
    }

    with output_file.open("w", encoding="utf-8") as out:
        for root, dirs, files in os.walk(base_dir):
            # Exclude specified directories from the walk
            dirs[:] = [d for d in dirs if d not in always_excluded]
            
            for file in files:
                file_path = Path(root) / file
                
                # Exclude based on gitignore and specific file names
                if file_path.name in always_excluded_file_names or is_ignored(file_path, gitignore_patterns):
                    continue

                if file_path == output_file:
                    continue

                try:
                    content = collect_file_content(file_path)
                    if content:
                        out.write(content)
                except Exception:
                    continue

        # Append the project file tree
        out.write("\n=== PROJECT FILE TREE ===\n")
        try:
            # Corrected: Use the -I flag for excluding directories and files with the BSD tree command.
            exclude_args = []
            for d in always_excluded:
                exclude_args.extend(["-I", d])
            
            tree_output = subprocess.check_output(["tree", *exclude_args], text=True)
            out.write(tree_output)
        except (subprocess.CalledProcessError, FileNotFoundError):
            out.write("Could not generate tree output. 'tree' command not found or failed.\n")

if __name__ == "__main__":
    main()