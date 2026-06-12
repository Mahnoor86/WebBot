# Python base image
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy project files
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (Render will override this)
EXPOSE 5000

# Start app
CMD ["python", "app.py"]