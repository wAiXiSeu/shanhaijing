---
name: dashscope-tts-ssl
description: Fix SSL certificate verification failures when using dashscope TTS (cosyvoice) websocket connections in Python 3.12+
source: auto-skill
extracted_at: '2026-06-29T10:13:30.730Z'
---

# Dashscope TTS SSL Fix

When using `dashscope.audio.tts_v2.SpeechSynthesizer` with Python 3.12+, websocket connections often fail with:

```
websocket closed due to [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate
```

## Fix

Install `certifi` and set `SSL_CERT_FILE` **before** importing dashscope:

```python
import os
try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer
```

## Install

```bash
python3.12 -m pip install certifi dashscope
```

## Notes

- The error manifests as a websocket timeout ("could not established within 5s") rather than a clear SSL error, making it hard to diagnose.
- Setting `SSL_CERT_FILE` must happen before the dashscope import — setting it after has no effect on the websocket SSL context.
- This affects all dashscope websocket-based APIs (TTS, real-time speech, etc.), not just cosyvoice.
