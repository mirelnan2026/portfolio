import type { Profile } from "../entities/profile";

/** Reads the owner's profile. There is exactly one. */
export interface ProfileRepository {
  get(): Promise<Profile>;
}
