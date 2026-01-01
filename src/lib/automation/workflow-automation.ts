import { firestoreService } from "@/lib/firebase/firestore-service";
import { Workflow, WorkflowStep, WorkflowInstance } from "@/types/workflow";
import { Task, TaskStatus } from "@/types";
import { Timestamp } from "firebase/firestore";

/**
 * Workflow Automation Service
 * Handles automatic workflow execution and task creation
 */

/**
 * Start a new workflow instance
 */
export async function startWorkflowAutomation(
    workflowId: string,
    clientId: string,
    clientName: string,
    startedBy: string
): Promise<string> {
    try {
        // Get workflow details
        const workflow = await firestoreService.getWorkflow(workflowId);
        if (!workflow || !workflow.isActive) {
            throw new Error("Workflow not found or inactive");
        }

        // Create workflow instance
        const instanceId = await firestoreService.startWorkflow(workflowId, clientId, startedBy);

        // Create first task if autoCreate is enabled
        const firstStep = workflow.steps.find((s: WorkflowStep) => s.stepNumber === 1);
        if (firstStep && firstStep.autoCreate) {
            await createTaskForStep(instanceId, workflow, firstStep, clientId, clientName, startedBy);
        }

        // Log automation
        await logAutomation('workflow_start', {
            workflowInstanceId: instanceId,
            workflowId,
            clientId,
            startedBy,
        });

        return instanceId;
    } catch (error) {
        console.error("Failed to start workflow automation:", error);
        throw error;
    }
}

/**
 * Create a task for a workflow step
 */
export async function createTaskForStep(
    instanceId: string,
    workflow: Workflow,
    step: WorkflowStep,
    clientId: string,
    clientName: string,
    createdBy: string
): Promise<string> {
    const instance = await firestoreService.getWorkflowInstance(instanceId);
    if (!instance) {
        throw new Error("Workflow instance not found");
    }

    // Calculate due date based on SLA
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + step.daysToComplete);

    // Create task
    const task: Partial<Task> = {
        title: `${workflow.name} - ${step.name}`,
        description: step.description || `שלב ${step.stepNumber} מתוך ${workflow.steps.length}`,
        type: step.taskType,
        priority: 'medium',
        status: 'new',
        date: dueDate.toISOString().split('T')[0],
        time: '09:00',
        workflowId: workflow.id,
        workflowName: workflow.name,
        stepNumber: step.stepNumber,
        daysToComplete: step.daysToComplete,
        clientId,
        clientName,
        assignedTo: step.assigneeRole || createdBy,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const taskId = await firestoreService.addTask(task as Task);

    // Log automation
    await logAutomation('task_created', {
        workflowInstanceId: instanceId,
        taskId,
        stepNumber: step.stepNumber,
        autoCreated: true,
    });

    return taskId;
}

/**
 * Check if workflow can proceed to next step
 */
export async function canProceedToNextStep(instanceId: string): Promise<boolean> {
    const instance = await firestoreService.getWorkflowInstance(instanceId);
    if (!instance) return false;

    const workflow = await firestoreService.getWorkflow(instance.workflowId);
    if (!workflow) return false;

    const currentStep = workflow.steps.find((s: WorkflowStep) => s.stepNumber === instance.currentStep);
    if (!currentStep) return false;

    // If step doesn't require previous completion, can always proceed
    if (!currentStep.requiresPreviousCompletion) return true;

    // Check if current step task is completed
    const tasks = await firestoreService.getTasksByWorkflow(instance.workflowId);
    const currentStepTask = tasks.find(
        t => t.stepNumber === instance.currentStep && t.clientId === instance.clientId
    );

    return currentStepTask?.status === 'completed';
}

/**
 * Proceed to next step in workflow
 */
export async function proceedToNextStep(instanceId: string): Promise<void> {
    const instance = await firestoreService.getWorkflowInstance(instanceId);
    if (!instance) {
        throw new Error("Workflow instance not found");
    }

    const workflow = await firestoreService.getWorkflow(instance.workflowId);
    if (!workflow) {
        throw new Error("Workflow not found");
    }

    // Check if can proceed
    if (!await canProceedToNextStep(instanceId)) {
        throw new Error("Cannot proceed to next step - requirements not met");
    }

    const nextStepNumber = instance.currentStep + 1;
    const nextStep = workflow.steps.find((s: WorkflowStep) => s.stepNumber === nextStepNumber);

    if (!nextStep) {
        // Workflow completed
        await firestoreService.updateWorkflowInstance(instanceId, {
            status: 'completed',
            completedAt: Timestamp.now(),
        });

        await logAutomation('workflow_completed', {
            workflowInstanceId: instanceId,
            workflowId: workflow.id,
        });

        return;
    }

    // Update instance to next step
    await firestoreService.updateWorkflowInstance(instanceId, {
        currentStep: nextStepNumber,
    });

    // Create task for next step if autoCreate
    if (nextStep.autoCreate) {
        await createTaskForStep(
            instanceId,
            workflow,
            nextStep,
            instance.clientId,
            instance.clientName || '',
            instance.startedBy
        );
    }

    await logAutomation('step_advanced', {
        workflowInstanceId: instanceId,
        fromStep: instance.currentStep,
        toStep: nextStepNumber,
    });
}

/**
 * Handle task completion - check if should advance workflow
 */
export async function onTaskCompleted(taskId: string): Promise<void> {
    const task = await firestoreService.getTask(taskId);
    if (!task || !task.workflowId) return;

    // Get workflow instances for this workflow and client
    const instances = await firestoreService.getWorkflowInstances(task.clientId);
    const activeInstance = instances.find(
        i => i.workflowId === task.workflowId && i.status === 'active'
    );

    if (!activeInstance) return;

    // Check if this task is for the current step
    if (task.stepNumber === activeInstance.currentStep) {
        // Try to proceed to next step
        try {
            await proceedToNextStep(activeInstance.id);
        } catch (error) {
            console.error("Failed to proceed to next step:", error);
        }
    }
}

/**
 * Log automation event
 */
async function logAutomation(
    type: string,
    details: any
): Promise<void> {
    try {
        await firestoreService.addDocument('automation_logs', {
            type,
            details,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error("Failed to log automation:", error);
    }
}

/**
 * Get automation logs
 */
export async function getAutomationLogs(
    filters?: {
        type?: string;
        workflowInstanceId?: string;
        startDate?: Date;
        endDate?: Date;
    }
): Promise<any[]> {
    // This would need a more complex query implementation
    // For now, return empty array
    return [];
}
