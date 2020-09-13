export default function convertHourToMinutes(time: string) {
  const [hour, minutes] = time.split(":").map(Number); // .map(Number) Converte string para Number
  const timeInMinutes = hour * 60 + minutes;
  return timeInMinutes;
}
