// import axios from 'axios';

// const AKOOL_API_KEY = import.meta.env.VITE_AKOOL_API_KEY; // or process.env if you're using CRA

// export const generateTalkingAvatar = async (text) => {
//   const payload = {
//     image_url: 'https://media.akool.com/avatars/elina/avatar_elina_neutral.jpg',
//     script: text,
//     voice_id: 'en-US-Wavenet-D',
//     language: 'en'
//   };

//   const response = await axios.post(
//     'https://api.akool.com/v1/avatar/create',
//     payload,
//     {
//       headers: {
//         'x-api-key': AKOOL_API_KEY,
//         'Content-Type': 'application/json'
//       }
//     }
//   );

//   const taskId = response.data.data.task_id;

//   // Poll until the video is ready
//   let videoUrl = null;
//   for (let i = 0; i < 10; i++) {
//     await new Promise(res => setTimeout(res, 2000)); // wait 2 sec
//     const status = await axios.get(`https://api.akool.com/v1/avatar/result/${taskId}`, {
//       headers: { 'x-api-key': AKOOL_API_KEY }
//     });

//     videoUrl = status.data.data?.video_url;
//     if (videoUrl) break;
//   }

//   return videoUrl;
// };