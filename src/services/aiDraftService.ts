import { PostCategoryType } from '../types';

export interface DraftPostResult {
  title: string;
  content: string;
  skillTags: string[];
  category: PostCategoryType;
}

/**
 * Service to generate natural Thai post drafts via Gemini API or intelligent offline rule-based generation.
 * Follows SkillsWop Demo Bot (SWP000001) persona.
 */
export const aiDraftService = {
  async generateDraft(topic: string): Promise<DraftPostResult> {
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      throw new Error('กรุณากรอกหัวข้อหรือแนวคิดสั้นๆ เพื่อให้บอทช่วยเขียนโพสต์');
    }

    // Attempt backend Gemini API first
    try {
      const response = await fetch('/api/gemini/draft-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: cleanTopic }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title && data.content && Array.isArray(data.skillTags)) {
          return {
            title: data.title,
            content: data.content,
            skillTags: data.skillTags,
            category: data.category || 'แชร์ความรู้',
          };
        }
      }
    } catch (err) {
      console.warn('Backend Gemini API call skipped or unreachable, using local AI bot model:', err);
    }

    // Resilient built-in model tailored for SkillsWop community
    return this.generateLocalSmartDraft(cleanTopic);
  },

  generateLocalSmartDraft(topic: string): DraftPostResult {
    const lower = topic.toLowerCase();

    // 1. English learning topics
    if (lower.includes('ภาษาอังกฤษ') || lower.includes('english') || lower.includes('พูดอังกฤษ') || lower.includes('speaking')) {
      const titles = [
        'เทคนิคฝึกพูดภาษาอังกฤษด้วยตนเอง ฉบับเห็นผลจริงใน 30 วัน',
        'แชร์วิธีจำคำศัพท์ภาษาอังกฤษแบบไม่ต้องท่องจำ ด้วยหลัก Spaced Repetition',
        'ก้าวข้ามความกลัวพูดภาษาอังกฤษ: 4 สเต็ปง่ายๆ ที่ใครก็เริ่มได้',
      ];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      return {
        title: randomTitle,
        category: 'แชร์ความรู้',
        skillTags: ['ภาษาอังกฤษ', 'English Speaking', 'การพัฒนาตนเอง', 'ภาษาต่างประเทศ'],
        content: `สวัสดีเพื่อนๆ ชุมชน SkillsWop ครับ/ค่ะ! 🌟\n\nสำหรับใครที่กำลังอยากเริ่มต้นฝึกภาษาอังกฤษด้วยตนเองแต่ไม่รู้จะเริ่มตรงไหน ขอแชร์ 3 เคล็ดลับที่ผมใช้ฝึกเป็นประจำ:\n\n1. Shadowing Technique: เปิดคลิป Podcast หรือ YouTube ที่ชอบแล้วฝึกพูดตามทันทีโดยไม่ต้องแปลเป็นไทย เพื่อจำจังหวะและสำเนียง\n2. บันทึกเสียงตัวเอง: อัดเสียงพูดสั้นๆ วันละ 2 นาที แล้วเปิดฟังจุดที่ออกเสียงยังไม่ชัด\n3. ฝึกคิดเป็นภาษาอังกฤษ: พยายามบรรยายสิ่งที่เห็นรอบตัวในความคิดเป็นคำศัพท์ง่ายๆ\n\nตอนนี้กำลังสนใจอยากเรียนรู้เรื่องการเขียนโปรแกรมพื้นฐาน หรือการแต่งภาพ ใครสนใจแลกเปลี่ยนวิชาทักมาพูดคุยหรือส่งคำขอแลกเปลี่ยนได้เลยนะครับ ยินดีแบ่งปันมากๆ ครับ! 😊`,
      };
    }

    // 2. Programming / Coding topics
    if (lower.includes('เขียนโปรแกรม') || lower.includes('coding') || lower.includes('python') || lower.includes('react') || lower.includes('developer') || lower.includes('โปรแกรมเมอร์')) {
      const titles = [
        'เริ่มต้นเขียนโปรแกรมอย่างไรให้ไม่ตัน: เส้นทางจากศูนย์สู่เข้าใจ Logic',
        '5 เครื่องมือที่ช่วยให้เขียนโค้ดได้สนุกและเข้าใจง่ายขึ้นสำหรับมือใหม่',
        'เทคนิค Debug โค้ดอย่างมีสเต็ป ไม่ต้องงมทั้งวัน',
      ];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      return {
        title: randomTitle,
        category: 'แนะนำวิชา',
        skillTags: ['การเขียนโปรแกรม', 'Python', 'Web Development', 'Logic Thinking'],
        content: `สวัสดีครับทุกคนใน SkillsWop! 💻\n\nหลายคนมักถามว่า "อยากเริ่มเขียนโค้ด ควรเริ่มจากอะไรก่อนดี?" จากประสบการณ์ส่วนตัว สิ่งสำคัญที่สุดไม่ใช่การจำ syntax ทั้งหมด แต่คือ:\n\n1. ทำความเข้าใจ Problem Solving และ Flowchart ก่อนเขียนโค้ดจริง\n2. เลือกภาษาที่เป็นมิตรกับผู้เริ่มต้น เช่น Python หรือ JavaScript\n3. ลองสร้างโปรเจกต์เล็กๆ ที่ใช้งานได้จริง เช่น โปรแกรมคำนวณรายรับรายจ่าย หรือ To-do list\n\nใครกำลังฝึกฝนเรื่องนี้อยู่ หรือมีข้อสงสัยตรงไหน ทักมาคุยกันได้ครับ! และถ้าใครพร้อมสอนทักษะการตัดต่อวิดีโอหรือภาษาญี่ปุ่น ทักมาขอแลกเปลี่ยนวิชากับผมได้เลยนะครับ! 🚀`,
      };
    }

    // 3. Exam / Study techniques
    if (lower.includes('อ่านหนังสือ') || lower.includes('สอบ') || lower.includes('study') || lower.includes('ท่องจำ')) {
      const titles = [
        'สูตรอ่านหนังสือสอบแบบ Active Recall & Pomodoro จำแม่น ไม่ล้า',
        'แชร์เทคนิคทำสรุปโน้ตให้น่าอ่านและดึงข้อมูลไปใช้ในห้องสอบได้ทันที',
        'จัดการเวลาก่อนสอบอย่างไร ไม่ให้อดนอนแต่คะแนนยังพุ่ง',
      ];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      return {
        title: randomTitle,
        category: 'เทคนิคการเรียน',
        skillTags: ['เทคนิคการเรียน', 'Active Recall', 'Productivity', 'เตรียมสอบ'],
        content: `สวัสดีเพื่อนๆ สายเรียนรู้ใน SkillsWop ทุกคนครับ 📚✨\n\nวันนี้อยากมาแชร์เทคนิคเตรียมตัวสอบที่ช่วยประหยัดเวลาและจำได้ยาวนานขึ้น:\n\n• เปลี่ยนจากการ "อ่านซ้ำหลายรอบ" มาเป็น "Active Recall": ปิดหนังสือแล้วลองเขียนหรืออธิบายสิ่งเพิ่งอ่านออกมาเป็นภาษาของตัวเอง\n• ใช้เทคนิค Pomodoro 25/5: โฟกัสเต็มที่ 25 นาที พัก 5 นาที สมองจะคงความสดชื่นและมีสมาธิได้ยาวตลอดวัน\n• ทำ Flashcards ทบทวนคำศัพท์และสูตรสำคัญ\n\nใครมีทริกการเรียนดีๆ มาแลกเปลี่ยนกันได้นะครับ! ตอนนี้ผมอยากเรียนรู้พื้นฐานการออกแบบด้วย Figma เพิ่มเติม ใครสอนได้ทักมาแลกเปลี่ยนกันได้เลยครับ! 🙌`,
      };
    }

    // 4. Canva / Design topics
    if (lower.includes('canva') || lower.includes('ออกแบบ') || lower.includes('graphic') || lower.includes('photoshop') || lower.includes('ดีไซน์')) {
      const titles = [
        'ออกแบบกราฟิกให้สวยแบบโปรด้วย Canva ใน 15 นาที',
        '3 กฎเหล็กของการจับคู่สีและฟอนต์ ให้งานออกแบบดูพรีเมียม',
        'แชร์เทคนิคจัดวาง Layout สำหรับงานพรีเซนเทชันและโซเชียลมีเดีย',
      ];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      return {
        title: randomTitle,
        category: 'แชร์ความรู้',
        skillTags: ['Canva', 'Graphic Design', 'การออกแบบ', 'Presentation'],
        content: `สวัสดีชาว SkillsWop ทุกคนครับ 🎨✨\n\nไม่จำเป็นต้องเป็นกราฟิกดีไซเนอร์มืออาชีพ ก็สามารถทำงานออกแบบให้ออกมาดูดี สะอาดตา และดึงดูดสายตาได้ง่ายๆ ด้วย Canva:\n\n1. จำกัดฟอนต์ไม่เกิน 2 แบบ: ฟอนต์หัวเรื่องตัวหนาชัดเจน + ฟอนต์เนื้อหาอ่านง่าย\n2. เว้นพื้นที่ว่าง (White Space): อย่าใส่ข้อความและองค์ประกอบแน่นเกินไป ปล่อยให้งานได้ "หายใจ"\n3. ใช้พาเลตต์สีไม่เกิน 3 สีหลัก เพื่อความคุมโทนที่สวยงาม\n\nใครอยากได้คำแนะนำเรื่องการออกแบบงานต่างๆ หรืออยากแลกเปลี่ยนกับทักษะการตลาดออนไลน์ ทักมาพูดคุยหรือส่งคำขอแลกเปลี่ยนวิชากันได้นะครับ! ยินดีต้อนรับทุกคนครับ 🎉`,
      };
    }

    // 5. General / Custom topic draft
    const cleanName = topic.replace(/^(อยาก|อยากจะ|แนะนำ|แชร์|สอน|เรียน)/g, '').trim() || topic;
    return {
      title: `แชร์ประสบการณ์และแนวทางการเรียนรู้เรื่อง "${cleanName}"`,
      category: 'แชร์ความรู้',
      skillTags: [cleanName, 'การเรียนรู้', 'พัฒนาตนเอง', 'SkillsWop'],
      content: `สวัสดีเพื่อนๆ ในคอมมูนิตี้ SkillsWop ครับ/ค่ะ! 💡\n\nวันนี้อยากมาแบ่งปันแนวคิดและประสบการณ์เกี่ยวกับ "${cleanName}" ซึ่งเป็นทักษะที่มีประโยชน์และน่าสนใจมากๆ ในยุคนี้:\n\n• สิ่งสำคัญที่สุดในการเริ่มต้นคือการตั้งเป้าหมายเล็กๆ ที่ทำได้จริงในแต่ละวัน\n• ลองหาเพื่อนหรือคู่ซ้อมที่สนใจเรื่องเดียวกัน จะช่วยให้มีแรงบันดาลใจและไม่ล้มเลิกกลางทาง\n• ฝึกนำสิ่งที่เรียนรู้ไปลงมือปฏิบัติจริงกับโปรเจกต์จริง\n\nใครที่กำลังสนใจเรื่องนี้ หรือมีคำถามอยากแลกเปลี่ยนความรู้ ยินดีพูดคุยกันเสมอครับ หรือถ้าใครมีทักษะอื่นๆ ที่อยากแลกเปลี่ยนกัน ทักข้อความหรือส่งคำขอแลกเปลี่ยนมาได้เลยนะครับ! 🤝✨`,
    };
  },
};
