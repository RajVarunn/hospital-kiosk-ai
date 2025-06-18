import requests
import json

url = "https://openapi.akool.com/api/open/v3/getToken"

payload = json.dumps({
  "clientId": "mXEQTk6FOmv+s1EobULb/A==",
  "clientSecret": "bi18EXBripCDCIzcqPheWAgcDfjrXoWz"
})
headers = {
  'Content-Type': 'application/json'
}

response = requests.post(url, headers=headers, data=payload)
print(response.json())