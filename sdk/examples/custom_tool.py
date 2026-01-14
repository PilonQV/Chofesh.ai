"""
Custom tool example
"""
import requests
from chofesh import Agent, Conversation
from chofesh.tools import Tool

class WeatherTool(Tool):
    """Custom tool for weather information"""
    
    name = "weather"
    description = "Get current weather for a location"
    parameters = {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City name or location"
            }
        },
        "required": ["location"]
    }
    
    def execute(self, parameters):
        """Get weather data"""
        location = parameters.get("location")
        
        # Call weather API (example using wttr.in)
        try:
            response = requests.get(
                f"https://wttr.in/{location}?format=j1",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                current = data["current_condition"][0]
                
                return {
                    "location": location,
                    "temperature": f"{current['temp_C']}°C",
                    "condition": current["weatherDesc"][0]["value"],
                    "humidity": f"{current['humidity']}%",
                    "wind_speed": f"{current['windspeedKmph']} km/h",
                }
            else:
                return {"error": "Failed to fetch weather data"}
        
        except Exception as e:
            return {"error": str(e)}

def main():
    # Create agent with custom weather tool
    agent = Agent(
        model="gpt-oss-120b",
        tools=[WeatherTool()],
    )
    
    # Start conversation
    conversation = Conversation(agent=agent)
    
    # Ask about weather
    response = conversation.send_message(
        "What's the weather like in San Francisco? Should I bring an umbrella?"
    )
    
    print("Assistant:", response.content)
    
    # Show tool usage
    if response.tool_calls:
        print("\nTool calls:")
        for tool_call in response.tool_calls:
            print(f"- {tool_call.name}({tool_call.parameters})")
            print(f"  Result: {tool_call.result}")

if __name__ == "__main__":
    main()
