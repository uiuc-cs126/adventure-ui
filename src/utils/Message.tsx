import { Position, Toaster } from '@blueprintjs/core';


export const TIMEOUT_ERROR = 30000;
export const TIMEOUT_SUCCESS = 2000;

const Message = Toaster.create({
  position: Position.BOTTOM,
  usePortal: true,
  canEscapeKeyClear: true,
});

export default Message;