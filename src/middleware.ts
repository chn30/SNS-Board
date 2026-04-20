import NextAuth from 'next-auth';

const { auth } = NextAuth({
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});

export default auth;

export const config = {
  matcher: ['/((?!login|api/auth|_next|favicon).*)'],
};
