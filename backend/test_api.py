import requests
import json

def test_api():
    """Test the API endpoints"""
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    try:
        print("Testing health endpoint...")
        response = requests.get(f"{base_url}/health")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text}")
        print()
    except Exception as e:
        print(f"Error testing health endpoint: {e}")
    
    # Test root endpoint
    try:
        print("Testing root endpoint...")
        response = requests.get(base_url)
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text}")
        print()
    except Exception as e:
        print(f"Error testing root endpoint: {e}")
    
    # Test defects endpoint
    try:
        print("Testing defects endpoint...")
        response = requests.get(f"{base_url}/api/defects")
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            defects = response.json()
            print(f"Number of defects: {len(defects)}")
            if defects:
                print("First defect:")
                print(json.dumps(defects[0], indent=2))
            else:
                print("No defects found")
        else:
            print(f"Response: {response.text}")
        print()
    except Exception as e:
        print(f"Error testing defects endpoint: {e}")
    
    # Test defects statistics endpoint
    try:
        print("Testing defects statistics endpoint...")
        response = requests.get(f"{base_url}/api/defects/statistics/summary")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text}")
        print()
    except Exception as e:
        print(f"Error testing defects statistics endpoint: {e}")

if __name__ == "__main__":
    test_api() 