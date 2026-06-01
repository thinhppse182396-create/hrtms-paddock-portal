
// services/raceResultApi.ts

export const createRaceResult = async (result: any) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/raceResults`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create race result");
  }

  return response.json();
};
