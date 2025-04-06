from itertools import product

def is_palindrome(s):
    return s == s[::-1]

def generate_palindromes(strings, max_len=9):
    palindromes = set()
    
    # Generate possible concatenations up to length 9
    for length in range(1, max_len + 1):
        for combination in product(strings, repeat=length):
            candidate = "".join(combination)
            if len(candidate) <= max_len and is_palindrome(candidate):
                palindromes.add(candidate)
    
    return sorted(palindromes)  # Sorted for consistent output

# Example input
input_strings = ["ab", "bax", "bba", "xy", "py", "ypa", "a", "abb"]

# Get palindromes
palindrome_list = generate_palindromes(input_strings)

# Print result
print(len(palindrome_list))
print(", ".join(palindrome_list))
