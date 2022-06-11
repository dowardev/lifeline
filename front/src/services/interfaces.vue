<script lang="ts">
interface GetUser {
  query: string;
}

interface UserRegister {
  name: string;
  user: string;
  email: string;
  password: string;
}

export { GetUser, UserRegister };
</script>
