import AppError from "../utils/app-error.js";
import createSupabaseClient from "../utils/create-supabase-client.js";

export async function addKid(req, res, next) {
  const full_name = req.body.full_name;
  const user_id = req.body.user_id ?? req.user.id;
  const classroom = req.body.classroom;
  const is_confirmed = req.user.role === "admin";

  const client = await createSupabaseClient();

  const { error } = await client.from("kids").insert({
    full_name,
    user_id,
    classroom,
    is_confirmed,
  });

  if (error) {
    throw new AppError("Could not add kid", 500, error);
  }

  return res.sendStatus(200);
}

export async function getKidsOf(req, res, next) {
  if (req.params.id === "admin") {
    next();
  }

  const client = await createSupabaseClient();
  const user_id = req.params.id;

  const { data, error } = await client
    .from("kids")
    .select("*")
    .eq("user_id", user_id);

  if (error) {
    throw new AppError("Could not getting kids", 500, error);
  }

  res.send(data);
}

export async function getAllKids(req, res, next) {
  if (req.user.role !== "admin") {
    throw new AppError(
      "You are not allowed to access this resource",
      403,
      error
    );
  }

  const client = await createSupabaseClient();

  const { data, error } = await client.from("kids").select("*");

  if (error) {
    throw new AppError("Could not getting all kids", 500, error);
  }

  res.send(data);
}

export async function callKid(req, res, next) {
  const client = await createSupabaseClient();
  const kid_id = req.params.id;
  const user_id = req.user.id;
  const { data: kid, error: kidError } = await client
    .from("kids")
    .select("id, user_id, is_confirmed")
    .eq("id", kid_id)
    .maybeSingle();
  if (kidError) {
    throw new AppError("Could not fetch kid", 500, kidError);
  }
  if (!kid) {
    throw new AppError("Kid not found", 400);
  }
  if (kid.user_id !== user_id && req.user.role !== "admin") {
    throw new AppError("You are not allowed to call this kid", 403);
  }
  if (!kid.is_confirmed) {
    throw new AppError("Kid is not confirmed", 400);
  }
  const { data: call, error: callError } = await client
    .from("calls")
    .insert({
      user_id,
      kid_id,
    })
    .select("*")
    .single();
  if (callError) {
    throw new AppError("Could not create call", 400, callError);
  }

  const { data: response, error: responseError } = await client
    .from("kids")
    .select("*")
    .eq("id", kid_id)
    .single();
  return res.status(200).json({
    message: "Kid call initiated successfully",
    data: {
      call,
      kid: response,
    },
  });

  res.send({ message: `Calling kid with id ${kid_id}` });
}