import re

with open('server.js', 'r') as f:
    content = f.read()

# Find and replace the authorization header logic
old_pattern = r"    // Add authorization header if we have a token\n    if \(merchantToken\) \{\n      headers\['Authorization'\] = `Bearer \$\{merchantToken\}`;\n    \}"

new_code = """    // Add authorization header - prefer userToken over merchantToken
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    } else if (merchantToken) {
      headers['Authorization'] = `Bearer ${merchantToken}`;
    }"""

content = re.sub(old_pattern, new_code, content)

with open('server.js', 'w') as f:
    f.write(content)

print("✅ Fixed authorization header logic")
