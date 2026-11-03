// Ciudades disponibles. `code` es el código de país que usa Radio Browser
// para buscar emisoras y `tz` la zona horaria IANA para calcular la hora.
const CITIES = [
  { id: "tokyo", name: "Tokyo", country: "Japan", code: "JP", tz: "Asia/Tokyo" },
  { id: "seoul", name: "Seoul", country: "South Korea", code: "KR", tz: "Asia/Seoul" },
  { id: "sydney", name: "Sydney", country: "Australia", code: "AU", tz: "Australia/Sydney" },
  { id: "mumbai", name: "Mumbai", country: "India", code: "IN", tz: "Asia/Kolkata" },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", code: "AE", tz: "Asia/Dubai" },
  { id: "cairo", name: "Cairo", country: "Egypt", code: "EG", tz: "Africa/Cairo" },
  { id: "paris", name: "Paris", country: "France", code: "FR", tz: "Europe/Paris" },
  { id: "london", name: "London", country: "United Kingdom", code: "GB", tz: "Europe/London" },
  { id: "madrid", name: "Madrid", country: "Spain", code: "ES", tz: "Europe/Madrid" },
  { id: "new-york", name: "New York", country: "United States", code: "US", tz: "America/New_York" },
  { id: "mexico-city", name: "Mexico City", country: "Mexico", code: "MX", tz: "America/Mexico_City" },
  { id: "bogota", name: "Bogotá", country: "Colombia", code: "CO", tz: "America/Bogota" },
  { id: "rio", name: "Rio de Janeiro", country: "Brazil", code: "BR", tz: "America/Sao_Paulo" },
  { id: "buenos-aires", name: "Buenos Aires", country: "Argentina", code: "AR", tz: "America/Argentina/Buenos_Aires" },
];

export default CITIES;
