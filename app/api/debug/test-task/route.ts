import { NextResponse } from 'next/server'
import { getUser, dbRowToGameState } from '@/lib/db'
import { TASKS } from '@/types/game'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = parseInt(searchParams.get('telegramId') || '123456789', 10)
    const taskId = searchParams.get('taskId') || 'daily-tap-100'

    const task = TASKS.find((t) => t.id === taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found', taskId })
    }

    const dbUser = await getUser(telegramId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found', telegramId })
    }

    const state = dbRowToGameState(dbUser)

    return NextResponse.json({
      taskId,
      taskRequirement: task.requirement,
      dbUser: {
        daily_taps: dbUser.daily_taps,
        total_taps: dbUser.total_taps,
      },
      state: {
        dailyTaps: state.dailyTaps,
        totalTaps: state.totalTaps,
      },
      wouldPass: state.dailyTaps >= (task.requirement || 0),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
