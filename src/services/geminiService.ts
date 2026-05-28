/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { ZONES, PLACES_BY_ZONE } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function geminiHide(zoneId: string): Promise<{ lat: number; lng: number; message: string }> {
  const zone = ZONES[zoneId as keyof typeof ZONES] || ZONES.global;

  // Randomly pick a well-known place from the curated list for this zone
  const places = PLACES_BY_ZONE[zoneId] || PLACES_BY_ZONE.global;
  const place = places[Math.floor(Math.random() * places.length)];

  // Ask Gemini for a playful hint message about the chosen location
  let prompt = `You are playing a game of GeoGuesser/Hide and Seek. You have hidden yourself at latitude ${place.lat.toFixed(4)}, longitude ${place.lng.toFixed(4)} in the zone: ${zone.name}.`;
  prompt += ` Write a cryptic but playful and cheeky hint about where you are hiding. Do not give away the exact coordinates. Have fun with it!`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING }
          },
          required: ["message"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      return { lat: place.lat, lng: place.lng, message: data.message || "I'm hiding somewhere in this zone! Come find me!" };
    }
  } catch (error) {
    console.error("Error getting hint from Gemini:", error);
  }

  return { lat: place.lat, lng: place.lng, message: "I'm hiding somewhere in this zone! Come find me!" };
}

export async function geminiProvideHint(zoneId: string, hiderLocation: {lat: number, lng: number}, previousGuesses: {lat: number, lng: number, distance: number, bearing: number}[]): Promise<string> {
  const zone = ZONES[zoneId as keyof typeof ZONES] || ZONES.global;
  
  let prompt = `You are hiding at latitude ${hiderLocation.lat}, longitude ${hiderLocation.lng} in ${zone.name}.`;
  prompt += ` The seeker has made ${previousGuesses.length} guesses so far.\n`;
  previousGuesses.forEach((g, i) => {
    prompt += `Guess ${i + 1} was ${g.distance.toFixed(2)} km away.\n`;
  });
  prompt += `Provide a short, cryptic, playful, and cheeky hint to help them find you. Do not give away the exact location. Have fun taunting them a little bit! Return ONLY a JSON object with a 'hint' property.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hint: { type: Type.STRING }
          },
          required: ["hint"]
        }
      }
    });
    
    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      return data.hint || "Keep looking! You'll never find me!";
    }
  } catch (error) {
    console.error("Error getting hint from Gemini:", error);
  }
  
  return "You're getting warmer... or colder! Who knows!";
}
