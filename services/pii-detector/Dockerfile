FROM python:3.12-slim

WORKDIR /app
ENV HF_HOME=/models

# CPU-only torch keeps the image small (no CUDA libraries)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Bake the model into the image so startup needs no network.
# Downloaded before the app's dependencies so changing them never re-downloads ~1 GB.
ARG GLINER_MODEL=urchade/gliner_multi_pii-v1
ENV GLINER_MODEL=${GLINER_MODEL}
RUN pip install --no-cache-dir huggingface_hub \
  && python -c "from huggingface_hub import snapshot_download; snapshot_download('${GLINER_MODEL}'); snapshot_download('microsoft/mdeberta-v3-base', allow_patterns=['*.json', '*.model'])"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Fails the build early if the model can't load with these dependencies
RUN python -c "from gliner import GLiNER; GLiNER.from_pretrained('${GLINER_MODEL}')"

COPY app.py .

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
