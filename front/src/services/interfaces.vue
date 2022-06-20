<script lang="ts">
// user
interface UserRegister {
  name: string;
  user: string;
  email: string;
  password: string;
}
interface SetUserToken {
  token: string;
}
interface ResendEmailConfirmation {
  email: string;
}
interface UserLogin {
  user: string;
  password: string;
  query: string;
}
interface GetUserAuth {
  query: string;
}
interface GetUserAuthResponse {
  id: string;
  name: string;
  user: string;
}

interface UserLoginResponse {
  auth: {
    access_token?: string;
    token_type?: string;
  };
}

// system
interface SystemMessage {
  message: string;
  color?: string;
}

export {
  GetUserAuth,
  UserRegister,
  SystemMessage,
  SetUserToken,
  ResendEmailConfirmation,
  UserLogin,
  UserLoginResponse,
  GetUserAuthResponse,
};
</script>
