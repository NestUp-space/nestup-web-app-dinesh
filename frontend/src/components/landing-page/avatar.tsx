import Image
 from "next/legacy/image";
type Props = {
  name: string;
  picture: string;
};

const Avatar = ({ name, picture }: Props) => {
  return (
    <div className="flex items-center">
      <Image src={picture} className="w-12 h-12 rounded-full mr-4" alt={name} width={75} height={75}/>
      <div className="text-xl font-bold ml-3">{name}</div>
    </div>
  );
};

export default Avatar;
