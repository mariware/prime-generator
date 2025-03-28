# from fastapi import FastAPI

# ### Create FastAPI instance with custom docs and openapi url
# app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# @app.get("/api/py/helloFastApi")
# def hello_fast_api():
#     return {"message": "Hello from FastAPI"}

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import random
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

def is_prime(n, k=5):
    """ Miller-Rabin primality test """
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False
    
    r, d = 0, n - 1
    while d % 2 == 0:
        d //= 2
        r += 1

    for _ in range(k):
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
    """ Find next prime >= n """
    if n < 2:
        return 2
    candidate = n if n % 2 != 0 else n + 1
    while not is_prime(candidate):
        candidate += 2
    return candidate

def generate_primes(primeDigits: int, iter: int):
    """ Generate `iter` prime numbers with `primeDigits` digits """
    count = 0
    while count < iter:
        lower_bound = 10**(primeDigits - 1)
        upper_bound = 10**primeDigits - 1
        n = random.randint(lower_bound, upper_bound)
        start_time = time.time()
        prime_number = next_prime(n)
        elapsed_time = time.time() - start_time

        yield f"data: {json.dumps({'index': count + 1, 'prime': str(prime_number), 'time': elapsed_time})}\n\n"

        count += 1

@app.get("/generate_prime")
async def stream_primes(primeDigits: int, iter: int):
    return StreamingResponse(generate_primes(primeDigits, iter), media_type="text/event-stream")