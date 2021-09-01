<script lang="ts">
import axios from "axios";

export default function() {
  function userRegister(
    name: string,
    user: string,
    email: string,
    password: string
  ) {
    return axios.post(
      "http://localhost:8000/api/auth/signup",
      { headers: { Accept: "application/json" } },
      {
        params: {
          name,
          user,
          email,
          password,
        },
      }
    );
  }
  function userLogin(email: string, password: string) {
    return axios.post(
      "http://localhost:8000/api/auth/login",
      { headers: { Accept: "application/json" } },
      {
        params: {
          email,
          password,
        },
      }
    );
  }
  return {
    userRegister,
    userLogin,
  };
}
</script>
