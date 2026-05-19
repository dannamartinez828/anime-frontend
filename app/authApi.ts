const BASE_URL =
  "https://anime-backend-bbwl.onrender.com";

export async function login(email: string, password: string) {

  const res = await fetch(
    `${BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {

    console.log(
      "ERROR BACKEND:",
      data
    );

    throw new Error(
      data.error ||
      data.message ||
      JSON.stringify(data)
    );
  }

  return data;
}

export async function register(
  username: string,
  email: string,
  password: string
) {

  const res = await fetch(
    `${BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {

    throw new Error(
      data.error ||
      "Error en registro"
    );
  }

  return data;
}

export default function AuthApi() {
  return null;
}