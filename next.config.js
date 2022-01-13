/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/vow",
        permanent: false,
      },
      {
        source: "/:set/all",
        destination: "/:set",
        permanent: false,
      },
    ];
  },
};
