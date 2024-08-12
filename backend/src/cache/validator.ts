// Lodash
import _forEach from "lodash/forEach";
import { redis } from "@config";
import Logger from "@logger";

const validator = () => {
  const KEYS_TO_VALIDATE = ["host", "port", "username", "password", "protocol"];
  let isConfigCorrect = true;

  const validateKey = (key: string) => {
    if (!redis[key]) {
      Logger.error(`Redis ${key} not found, please check env and try again.`);
      isConfigCorrect = false;
    }
  };

  _forEach(KEYS_TO_VALIDATE, validateKey);

  return isConfigCorrect;
};

export default validator;
