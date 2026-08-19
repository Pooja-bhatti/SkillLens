import os
import ast
import json
import re

LEETCODE_DIR = r"C:\Users\DELL\Downloads\leetcode-py-main\leetcode-py-main\leetcode"
OUTPUT_FILE = r"C:\Users\DELL\Desktop\final year (AI INTERVIEW0\server\data\leetcodeDataset_new.json"

def extract_tests_from_ast(filepath):
    """Parse pytest parametrize decorator to extract test cases."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filename=filepath)
            
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
                # Look for decorators
                for dec in node.decorator_list:
                    if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                        if dec.func.attr == "parametrize":
                            # Second argument of parametrize is the list of test cases
                            if len(dec.args) >= 2 and isinstance(dec.args[1], (ast.List, ast.Tuple)):
                                test_cases = []
                                for elt in dec.args[1].elts:
                                    if isinstance(elt, ast.Tuple):
                                        # Evaluate the tuple elements safely
                                        values = [ast.literal_eval(e) for e in elt.elts]
                                        # Last element is expected output, the rest are inputs
                                        expected = values[-1]
                                        inputs = values[:-1]
                                        
                                        # Format inputs for stdin (space separated strings)
                                        # For multiple inputs, we join them with newlines or spaces
                                        input_str = "\n".join([str(i).replace("'", '"') for i in inputs])
                                        expected_str = str(expected).replace("'", '"')
                                        
                                        test_cases.append({
                                            "input": input_str,
                                            "expectedOutput": expected_str
                                        })
                                return test_cases
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
    return []

def extract_problem_info(readme_path):
    """Extract description, difficulty, concepts, and constraints from README."""
    info = {
        "question": "",
        "concept": "General",
        "difficulty": "medium",
        "variableConstraints": [],
        "must_have": ["optimal solution", "handle edge cases", "correct time complexity"]
    }
    
    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Extract Difficulty
            diff_match = re.search(r"\*\*Difficulty:\*\*\s*(Easy|Medium|Hard)", content, re.IGNORECASE)
            if diff_match:
                info["difficulty"] = diff_match.group(1).lower()
                
            # Extract Topics/Concept
            topics_match = re.search(r"\*\*Topics:\*\*\s*(.*)", content)
            if topics_match:
                topics = [t.strip() for t in topics_match.group(1).split(",")]
                if topics:
                    info["concept"] = topics[0] # Use primary topic
            
            # Extract Description
            desc_match = re.search(r"## Problem Description\n+(.*?)\n+## (Examples|Constraints)", content, re.DOTALL)
            if desc_match:
                info["question"] = desc_match.group(1).strip()
            
            # Extract Constraints
            const_match = re.search(r"## Constraints\n+(.*?)(?:$|##)", content, re.DOTALL)
            if const_match:
                constraints_raw = const_match.group(1).strip()
                constraints = [c.replace("- `", "").replace("`", "").strip() for c in constraints_raw.split("\n") if c.strip().startswith("-")]
                info["variableConstraints"] = constraints
                
    except Exception as e:
        print(f"Error reading {readme_path}: {e}")
        
    return info

def main():
    dataset = []
    if not os.path.exists(LEETCODE_DIR):
        print(f"Directory not found: {LEETCODE_DIR}")
        return
        
    for item in os.listdir(LEETCODE_DIR):
        problem_dir = os.path.join(LEETCODE_DIR, item)
        if not os.path.isdir(problem_dir):
            continue
            
        readme_path = os.path.join(problem_dir, "README.md")
        test_path = os.path.join(problem_dir, "test_solution.py")
        
        if os.path.exists(readme_path) and os.path.exists(test_path):
            print(f"Processing {item}...")
            
            info = extract_problem_info(readme_path)
            test_cases = extract_tests_from_ast(test_path)
            
            if info["question"] and test_cases:
                info["testCases"] = test_cases
                info["timeConstraint"] = 3000 if info["difficulty"] == "hard" else 2000
                info["spaceConstraint"] = 256
                dataset.append(info)
                
    if dataset:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2)
        print(f"Successfully generated {len(dataset)} problems!")
        print(f"Saved to {OUTPUT_FILE}")
    else:
        print("No problems were successfully parsed.")

if __name__ == "__main__":
    main()
