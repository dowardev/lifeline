<script lang="ts">
import { Storage } from "@ionic/storage";
const store = new Storage();
store.create();

export default function() {
  async function setUserToken(token: string) {
    await store.set("token", token);
  }
  async function getUserToken() {
    return await store.get("token");
  }
  return {
    setUserToken,
    getUserToken,
  };
}
</script>
