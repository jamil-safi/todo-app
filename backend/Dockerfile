FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps needed for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a non-root user and hand ownership of /app over to it,
# so the app doesn't run as root inside the container
RUN addgroup --system appgroup && adduser --system --group appuser \
    && chown -R appuser:appgroup /app

ENV HOME=/app

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn todoapp.wsgi:application --bind 0.0.0.0:8000"]