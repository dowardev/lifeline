import mitt from "mitt";
const emitter = mitt();
const eventBus = (): { emitter: ReturnType<typeof mitt> } => {
  return { emitter };
};
export default eventBus;
