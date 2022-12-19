# TempestWX/WeatherFlow WebSocket API Node.js Adapter

This is a quick adapter to get data for a TempestWX/WeatherFlow weather station via the WebSocket API endpoint and store it in a SQLite database. Not a lot of error handling or safety and should not be trusted in a production environment.

Instructions:
- Place your TempestWX private token and device ID (not to be confused with station ID) in the .env file.
- ```node index.js```

