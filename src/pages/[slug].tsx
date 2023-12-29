import { createServerSideHelpers } from "@trpc/react-query/server";
import Head from "next/head";
import { appRouter } from "~/server/api/root";
import { api } from "~/utils/api";
import { db } from "~/server/db";
import superjson from "superjson";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import { PageLayout } from "~/components/layout";

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getByUsername.useQuery({
    username,
  });
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="border-b border-slate-400 bg-slate-600">
          <Image
            src={data.imageUrl}
            alt={`Imagem de Perfil`}
            width={48}
            height={48}
            className="-mb-2"
          />
          <div>{data.username}</div>
        </div>
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: superjson,
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("Nenhum @");

  const username = slug.replace("@", "");

  await ssg.profile.getByUsername.prefetch({ username: username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username: username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
