// services/registrationAPI.ts

export const createRegistration = async (registration: any) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/registrations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registration),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create registration");
  }

  return response.json();
};
