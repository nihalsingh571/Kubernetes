#!/bin/bash
# Test runner script for InternConnect backend

echo "Running Django tests with coverage..."

# Run tests with coverage
python -m pytest --cov=. --cov-report=html --cov-report=term

# Open coverage report in browser (macOS)
if [ -f "htmlcov/index.html" ]; then
    echo "Opening coverage report..."
    open htmlcov/index.html
fi