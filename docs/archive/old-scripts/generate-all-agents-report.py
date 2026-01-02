#!/usr/bin/env python3
import subprocess
import re

output = []
output.append("# Complete Agent Report - All Agents Across All Commits\n")
output.append("**Generated:** Comprehensive analysis of EVERY AI agent in the codebase\n")
output.append("**Time Period:** October 1, 2025 - Present\n\n")

# Define all agent files
agent_files = {
    'lib/content-warning-agent.ts': {
        'name': 'Content Warning Agent',
        'description': 'Main agent for generating content warnings from book metadata',
        'functions': ['findBookAndGenerateWarnings', 'generateContentWarnings'],
        'primary': True
    },
    'lib/book-finder-agent.ts': {
        'name': 'Book Finder Agent',
        'description': 'Agent for finding book information by ISBN',
        'functions': [],
        'primary': True
    },
    'lib/services/severity-classification-agent.ts': {
        'name': 'Severity Classification Agent',
        'description': 'Agent for classifying severity levels based on context',
        'functions': ['classifySeverity', 'getClassificationAgentConfig'],
        'primary': True
    },
    'lib/services/content-review-agent.ts': {
        'name': 'Content Review Agent',
        'description': 'Agent for reviewing and validating content warnings (rule-based, not AI)',
        'functions': ['detectDuplicates', 'detectMisclassification'],
        'primary': False
    },
    'lib/services/multi-model-service.ts': {
        'name': 'Multi-Model Service',
        'description': 'Service that orchestrates multiple AI models (GPT-4o + Gemini)',
        'functions': ['runMultiModelAnalysis', 'generateWarningsWithGemini'],
        'primary': True
    }
}

total_commits = 0

for file_path, agent_info in agent_files.items():
    output.append(f"\n{'='*80}\n")
    output.append(f"# {agent_info['name']}\n")
    output.append(f"**File:** `{file_path}`\n")
    output.append(f"**Description:** {agent_info['description']}\n")
    output.append(f"**Primary Agent:** {'Yes' if agent_info['primary'] else 'No'}\n\n")
    
    # Get commits
    result = subprocess.run(
        ['git', 'log', '--all', '--format=%H|%ad|%s', '--date=short', '--since=2025-10-01', '--reverse', '--', file_path],
        capture_output=True, text=True
    )
    
    commits = []
    for line in result.stdout.strip().split('\n'):
        if '|' in line:
            hash_val, date, msg = line.split('|', 2)
            commits.append((hash_val, date, msg))
    
    if not commits:
        output.append("*(No commits found)*\n\n")
        continue
    
    total_commits += len(commits)
    output.append(f"**Total commits:** {len(commits)}\n\n")
    
    for idx, (hash_val, date, msg) in enumerate(commits, 1):
        output.append(f"\n## Commit {idx}/{len(commits)}: {date}: {msg}\n")
        output.append(f"**Hash:** `{hash_val[:7]}`\n\n")
        
        file_result = subprocess.run(
            ['git', 'show', f'{hash_val}:{file_path}'],
            capture_output=True, text=True
        )
        
        if file_result.returncode != 0:
            output.append("*(File not found)*\n\n")
            continue
        
        content = file_result.stdout
        
        # Extract Agent instances
        agent_instances = re.findall(r'new Agent\([^)]*\{[^}]*name:\s*["\']([^"\']+)["\']', content, re.DOTALL)
        if agent_instances:
            for agent_name in set(agent_instances):
                output.append(f"### Agent Instance: {agent_name}\n")
                
                # Find model
                model_pattern = r'model:\s*["\']([^"\']+)["\']'
                model_match = re.search(model_pattern, content)
                if model_match:
                    output.append(f"**Model:** `{model_match.group(1)}`\n\n")
                
                # Find instructions
                inst_pattern = r'instructions:\s*`([^`]+)`'
                inst_match = re.search(inst_pattern, content, re.DOTALL)
                if inst_match:
                    instructions = inst_match.group(1).strip()
                    instructions = re.sub(r'\$\{[^}]+\}', '[variable]', instructions)
                    if len(instructions) > 2000:
                        instructions = instructions[:2000] + "\n\n... (truncated)"
                    output.append("**Instructions:**\n```\n" + instructions + "\n```\n\n")
        
        # Check for config functions
        config_funcs = re.findall(r'const (get\w+Config|get\w+Instructions)\s*=', content)
        if config_funcs:
            output.append("### Configuration Functions:\n")
            for func in set(config_funcs):
                output.append(f"- `{func}`\n")
                
                # Extract function body - enhanced pattern matching
                func_content = None
                
                # Pattern 1: const funcName = () => `...`
                pattern1 = r'const ' + func + r'\s*=\s*\([^)]*\)\s*=>\s*`([^`]+)`'
                func_match = re.search(pattern1, content, re.DOTALL)
                if func_match:
                    func_content = func_match.group(1).strip()
                
                # Pattern 2: Find function and extract between backticks manually
                if not func_content:
                    func_start = content.find(f'const {func}')
                    if func_start != -1:
                        # Find the => arrow
                        arrow_pos = content.find('=>', func_start)
                        if arrow_pos != -1:
                            # Find first backtick after =>
                            backtick_start = content.find('`', arrow_pos)
                            if backtick_start != -1:
                                # Find matching closing backtick
                                backtick_end = content.find('`', backtick_start + 1)
                                if backtick_end != -1:
                                    func_content = content[backtick_start + 1:backtick_end].strip()
                
                if func_content:
                    # Clean template variables but preserve structure
                    func_content = re.sub(r'\$\{[^}]+\}', '[variable]', func_content)
                    # Preserve important parts if truncating
                    if len(func_content) > 3000:
                        func_content = func_content[:2000] + "\n\n... (truncated - middle section removed) ...\n\n" + func_content[-500:]
                    output.append(f"\n**{func} Full Instructions:**\n```\n{func_content}\n```\n\n")
                else:
                    output.append(f"  *(Could not extract {func} content - function exists but pattern matching failed)*\n\n")
        
        # Extract models
        models = re.findall(r'model:\s*["\']([^"\']+)["\']', content)
        if models:
            output.append("### Models Used:\n")
            for model in set(models):
                output.append(f"- `{model}`\n")
            output.append("\n")
        
        # Key functions
        if agent_info['functions']:
            output.append("### Key Functions:\n")
            for func_name in agent_info['functions']:
                func_pattern = func_name.replace('(', r'\(').replace(')', r'\)')
                if re.search(rf'\b{func_pattern}\s*[=:]', content):
                    output.append(f"- `{func_name}`: ✅ Present\n")
                else:
                    output.append(f"- `{func_name}`: ❌ Not found\n")
            output.append("\n")
        
        # Tools
        tools_match = re.search(r'tools:\s*\[(.*?)\]', content, re.DOTALL)
        if tools_match:
            tools = re.findall(r'name:\s*["\']([^"\']+)["\']', tools_match.group(1))
            if tools:
                output.append("### Tools:\n")
                for tool in set(tools):
                    output.append(f"- `{tool}`\n")
                output.append("\n")
        
        # Flags
        flags = []
        if re.search(r'typically|genre.*convention|author.*typical', content, re.IGNORECASE):
            flags.append("⚠️ **Contains generic phrasing**")
        if re.search(r'Evidence-Based|DO NOT.*assumption|ONLY.*THIS SPECIFIC', content, re.IGNORECASE):
            flags.append("✅ **Evidence-based instructions**")
        if re.search(r'gemini|Gemini', content):
            flags.append("🤖 **Uses Gemini**")
        if re.search(r'gpt-4o|gpt4o', content, re.IGNORECASE):
            flags.append("🧠 **Uses GPT-4o**")
        if re.search(r'instructionMode|getOldInstructions|getNewInstructions|getHybridInstructions', content):
            flags.append("📋 **Has multiple instruction modes**")
        
        if flags:
            for flag in flags:
                output.append(flag + "\n")
            output.append("\n")
        
        output.append("---\n")
    
    output.append("\n")

output.insert(3, f"**Total commits analyzed:** {total_commits}\n\n")

with open('ALL_AGENTS_COMPLETE_REPORT.md', 'w') as f:
    f.write(''.join(output))

print(f"✅ Report generated: ALL_AGENTS_COMPLETE_REPORT.md")
print(f"   Total commits: {total_commits}")

