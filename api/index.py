from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

import json
import os
import random
import time

# Initialize app.
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
is_prod = os.getenv("ENV") == "production"
origins = (
    ["https://prime-generator.vercel.app"] if is_prod
    else ["http://localhost:3000"]
)

# Enable CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods=["GET"], 
    allow_headers=["Authorization", "Content-Type"],
)

def is_prime(n, i = 5):
    """ This function performs the Miller-Rabin primality test. """
    
    if n < 2: return False
    if n in (2, 3): return True
    if n % 2 == 0: return False
    
    r, d = 0, n - 1
    while d % 2 == 0:
        d //= 2
        r += 1

    for _ in range(i):
        a = random.randint(2, n - 2)
        x = pow(a, d, n)
        
        if x == 1 or x == n - 1:
            continue
        
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    
    return True

def next_prime(n):
    """ This function finds the next prime > `n`. """

    if n < 2:
        return 2
    candidate = n if n % 2 != 0 else n + 1
    while not is_prime(candidate):
        candidate += 2
    return candidate

def generate_primes(primeDigits: int, iter: int):
    """ This function genrates primes. """
    for i in range(iter):
        lower_bound = 10 ** (primeDigits - 1)
        upper_bound = 10 ** primeDigits - 1
        n = random.randint(lower_bound, upper_bound)

        start_time = time.time()
        prime_number = next_prime(n)
        elapsed_time = time.time() - start_time

        yield f"data: {json.dumps({'index': i + 1, 'prime': str(prime_number), 'time': elapsed_time})}\n\n"

    yield "event: end\ndata: null\n\n"

@app.get("/api/py/generate_prime")
def stream_primes(primeDigits: int, iter: int):
    return StreamingResponse(generate_primes(primeDigits, iter), media_type="text/event-stream")