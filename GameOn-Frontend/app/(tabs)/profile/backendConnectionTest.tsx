/* Uncomment the component to test the backend connection in local */

// export const BACKEND_TEST = (getToken) => {
//   return (
//     <Button
//       title="test backend"
//       onPress={async () => {
//         console.log(process.env.EXPO_PUBLIC_API_BASE_URL);

//         const token = await getToken();

//         console.log(token);

//         const base64Url = token?.split(".")[1];
//         const base64 = base64Url?.replace(/-/g, "+").replace(/_/g, "/");
//         const jsonPayload = JSON.parse(atob(base64));

//         console.log("iss:", jsonPayload.iss);
//         console.log("aud:", jsonPayload.aud);

//         const res = await fetch(
//           `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/user/test`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//             body: JSON.stringify({ ping: "pong" }),
//           }
//         );

//         const text = await res.text();
//         console.log("Status:", res.status);
//         console.log("Response:", text);
//       }}
//     />
//   );
// };
