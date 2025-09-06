# app/services/llm_client.py

import os
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from fastapi import HTTPException
from google.generativeai import GenerativeModel
from pydantic import BaseModel, Field, ValidationError

# --- OPTIMIZED PATTERN: Initialize model once on application startup ---
gemini_model: Optional[GenerativeModel] = None

# GEMINI_API_KEY HERE!
try:
    # Had an .env issue so i just hardcoded it (very aware this is bad practice but it was quicklest/simplest )
    api_key = "" 
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not found.")

    genai.configure(api_key=api_key)

    gemini_model = genai.GenerativeModel("models/gemini-1.5-flash")
    print("✅ Google GenAI Client initialized successfully.")

except (ValueError, ImportError) as e:
    # This will be printed on startup if the configuration fails.
    print(f"⚠️ Warning: Google GenAI Client could not be initialized. Error: {e}")


class ExtractedDataSchema(BaseModel):
    """Pydantic schema to enforce structured output from the Gemini LLM."""

    product: Optional[str] = Field(description="The name of the quoted product, e.g., 'Almonds'.")
    price_per_pound: Optional[float] = Field(description="The price per pound in USD. Extract only the numerical value.")
    country_of_origin: Optional[str] = Field(description="The country where the product was sourced.")
    certifications: List[str] = Field(default_factory=list, description="A list of any mentioned product certifications.")
    minimum_order_quantity: Optional[int] = Field(description="The MOQ in pounds. Extract only the numerical value.")

    company_name: Optional[str] = Field(description="The supplier's company name from the signature.")
    contact_name: Optional[str] = Field(description="The supplier's contact person name from the signature.")

    supplier_email: Optional[str] = Field(description="The supplier's contact email, typically from the email signature.")
    supplier_phone: Optional[str] = Field(description="The supplier's contact phone number, typically from the email signature.")


async def extract_quote_data_from_email(email_text: str) -> ExtractedDataSchema:
    """
    Uses Gemini to extract structured data from raw email text into a Pydantic model.
    """
    if not gemini_model:
        # This will be triggered if the model failed to initialize on startup
        raise HTTPException(status_code=503, detail="Gemini client is not available. Check server logs for initialization errors.")

    # --- SIMPLIFIED PROMPT: More effective and less token-heavy ---
    prompt = "Analyze the following email and extract the relevant quote and supplier information."

    try:
        generation_config: Dict[str, Any] = {
            "response_mime_type": "application/json",
            "response_schema": ExtractedDataSchema,
        }

        response = await gemini_model.generate_content_async(contents=[prompt, email_text], generation_config=generation_config)

        parsed_data = ExtractedDataSchema.model_validate_json(response.text)
        return parsed_data

    except (ValidationError, AttributeError) as e:
        # This block catches errors if the LLM's JSON doesn't match the Pydantic schema.
        print(f"--- LLM Validation Error --- \n{e}")
        print(f"--- Raw LLM Response --- \n{response.text if 'response' in locals() else 'No response object'}")
        raise HTTPException(
            status_code=502,  # Bad Gateway: The upstream LLM service returned an invalid response
            detail="The LLM response could not be validated. Check server logs for the raw response.",
        )
    except Exception as e:
        # This catches other potential errors (e.g., network issues, API key problems).
        print(f"An unexpected error occurred with the Gemini API: {e}")
        raise HTTPException(status_code=502, detail=f"An error occurred with the LLM service: {str(e)}")


async def generate_clarification_email(prompt: str) -> str:
    """
    Uses Gemini to generate a text-based response from a detailed prompt.
    """
    if not gemini_model:
        raise HTTPException(status_code=503, detail="Gemini client is not available. Check server logs for initialization errors.")

    try:
        response = await gemini_model.generate_content_async(contents=[prompt])
        return response.text
    except Exception as e:
        # This catches other potential errors (e.g., network issues, API key problems).
        print(f"An unexpected error occurred with the Gemini API: {e}")
        raise HTTPException(status_code=502, detail=f"An error occurred with the LLM service: {str(e)}")