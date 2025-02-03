import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isEnrolledInCourse } from "@/sanity/lib/student/isEnrolledInCourse";
import { getLessonById } from "@/sanity/lib/lessons/getLessonById";
import { PortableText } from "@portabletext/react";
import { LoomEmbed } from "@/components/LoomEmbed";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId";
import { getLessonCompletions } from "@/sanity/lib/lessons/getLessonCompletions";
import { LessonCompleteButton } from "@/components/LessonCompleteButton";

interface LessonPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const user = await currentUser();
  const { courseId, lessonId } = await params;

  if (!user?.id) {
    return redirect("/");
  }

  const isEnrolled = await isEnrolledInCourse(user.id, courseId);

  if (!isEnrolled) {
    return redirect(`/courses/${courseId}`);
  }

  const [lesson, student, completions] = await Promise.all([
    getLessonById(lessonId),
    getStudentByClerkId(user.id),
    getLessonCompletions(user.id, courseId),
  ]);

  if (!lesson || !student) {
    return redirect(`/dashboard/courses/${courseId}`);
  }

  const isCompleted = completions.completedLessons.some(
    (completion) => completion.lesson?._id === lessonId
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>

          {lesson.description && (
            <p className="text-muted-foreground mb-8">{lesson.description}</p>
          )}

          <div className="space-y-8">
            {/* Video Section */}
            {lesson.videoUrl && <VideoPlayer url={lesson.videoUrl} />}

            {/* Loom Embed Video if loomUrl is provided */}
            {lesson.loomUrl && <LoomEmbed shareUrl={lesson.loomUrl} />}

            {/* Lesson Content */}
            {lesson.content && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Lesson Notes</h2>
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  <PortableText value={lesson.content} />
                </div>
              </div>
            )}

            <LessonCompleteButton
              lessonId={lesson._id}
              studentId={student._id}
              isCompleted={isCompleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
