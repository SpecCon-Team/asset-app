#!/bin/bash

echo "Files without SweetAlert2 imports:"
echo "===================================="

cd src/features

for file in $(find . -name "*Page.tsx" -o -name "*Form.tsx"); do
    if ! grep -q "sweetalert" "$file"; then
        echo "$file"
    fi
done
