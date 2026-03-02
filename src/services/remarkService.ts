import { RemarkType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";


export const remarkService = {
    async createRemark(data: {
        type: RemarkType;
        title: string;
        description: string;
        courseId: string;
        userId: string;
        teacherId: string;
    }) {
        return await prisma.remark.create({
            data: {
                type: data.type,
                title: data.title,
                description: data.description,
                courseId: data.courseId,
                userId: data.userId,
                teacherId: data.teacherId,
            },
        });
    },

    async getStudentRemarks(courseId: string, userId: string) {
        return await prisma.remark.findMany({
            where: { courseId, userId },
            orderBy: { date: "desc" },
            include: {
                teacher: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
    },

    async getCourseRemarks(courseId: string) {
        return await prisma.remark.findMany({
            where: { courseId },
            orderBy: { date: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: true,
                    },
                },
                teacher: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    },

    async updateRemark(remarkId: string, data: {
        type?: RemarkType;
        title?: string;
        description?: string;
    }) {
        return await prisma.remark.update({
            where: { id: remarkId },
            data: {
                ...(data.type && { type: data.type }),
                ...(data.title && { title: data.title }),
                ...(data.description && { description: data.description }),
            },
        });
    },

    async deleteRemark(remarkId: string) {
        return await prisma.remark.delete({
            where: { id: remarkId },
        });
    },
};
