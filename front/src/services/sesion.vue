<script lang="ts">
import axios from "axios";

export default function() {
  function userRegister(
    name: string,
    user: string,
    email: string,
    password: string
  ) {
    console.log(name, user, email, password);
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
  return {
    userRegister,
  };
}
</script>
