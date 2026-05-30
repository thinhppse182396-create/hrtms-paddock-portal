export const getHorses = async () => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/horses`
  );

  return response.json();
};

export const createHorse = async (horse) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/horses`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(horse),
    }
  );

  return response.json();
};